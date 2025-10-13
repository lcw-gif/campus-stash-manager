import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, RefreshCw, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type CourseStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
type CourseItemStatus = 'reserved' | 'returned' | 'outstocked' | 'partial';

interface Course {
  id: string;
  course_name: string;
  description?: string;
  course_date: string;
  instructor?: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

interface CourseItem {
  id: string;
  course_id: string;
  item_name: string;
  quantity_reserved: number;
  quantity_returned: number;
  quantity_outstocked: number;
  status: CourseItemStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [courseForm, setCourseForm] = useState({
    course_name: '',
    description: '',
    course_date: '',
    instructor: '',
    status: 'planned' as CourseStatus,
  });

  const [itemForm, setItemForm] = useState({
    item_name: '',
    quantity_reserved: 0,
    notes: '',
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseItems(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_date', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } else {
      setCourses(data || []);
    }
    setIsLoading(false);
  };

  const loadCourseItems = async (courseId: string) => {
    const { data, error } = await supabase
      .from('course_items')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load course items",
        variant: "destructive",
      });
    } else {
      setCourseItems(data || []);
    }
  };

  const handleAddCourse = async () => {
    if (!courseForm.course_name || !courseForm.course_date) {
      toast({
        title: "Validation Error",
        description: "Course name and date are required",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([courseForm])
      .select();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setCourseForm({
        course_name: '',
        description: '',
        course_date: '',
        instructor: '',
        status: 'planned',
      });
      setIsAddCourseOpen(false);
      loadCourses();
    }
  };

  const handleAddItem = async () => {
    if (!selectedCourse) return;
    
    if (!itemForm.item_name || itemForm.quantity_reserved <= 0) {
      toast({
        title: "Validation Error",
        description: "Item name and quantity (>0) are required",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('course_items')
      .insert([{
        course_id: selectedCourse.id,
        ...itemForm,
        status: 'reserved' as CourseItemStatus,
      }])
      .select();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item added to course",
      });
      setItemForm({
        item_name: '',
        quantity_reserved: 0,
        notes: '',
      });
      setIsAddItemOpen(false);
      loadCourseItems(selectedCourse.id);
    }
  };

  const handleReturnItem = async (item: CourseItem) => {
    const remainingQty = item.quantity_reserved - item.quantity_returned - item.quantity_outstocked;
    
    const { error } = await supabase
      .from('course_items')
      .update({
        quantity_returned: item.quantity_reserved - item.quantity_outstocked,
        status: item.quantity_outstocked > 0 ? 'partial' : 'returned',
      })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to return item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${remainingQty} units returned`,
      });
      loadCourseItems(item.course_id);
    }
  };

  const handleOutstockItem = async (item: CourseItem) => {
    const remainingQty = item.quantity_reserved - item.quantity_returned - item.quantity_outstocked;
    
    const { error } = await supabase
      .from('course_items')
      .update({
        quantity_outstocked: item.quantity_reserved - item.quantity_returned,
        status: item.quantity_returned > 0 ? 'partial' : 'outstocked',
      })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to outstock item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${remainingQty} units outstocked`,
      });
      loadCourseItems(item.course_id);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Course deleted",
      });
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setCourseItems([]);
      }
      loadCourses();
    }
  };

  const getStatusColor = (status: CourseStatus | CourseItemStatus) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-blue-500';
      case 'returned':
        return 'bg-green-500';
      case 'outstocked':
        return 'bg-purple-500';
      case 'partial':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
          <p className="text-muted-foreground">
            Manage courses and reserve materials for workshops
          </p>
        </div>
        
        <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>Create a new course or workshop</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="course_name">Course Name *</Label>
                <Input
                  id="course_name"
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                  placeholder="e.g., Arduino Workshop"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="Course details..."
                />
              </div>
              
              <div>
                <Label htmlFor="course_date">Course Date *</Label>
                <Input
                  id="course_date"
                  type="date"
                  value={courseForm.course_date}
                  onChange={(e) => setCourseForm({ ...courseForm, course_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  value={courseForm.instructor}
                  onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                  placeholder="Instructor name"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={courseForm.status}
                  onValueChange={(value: CourseStatus) => setCourseForm({ ...courseForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCourseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCourse}>Create Course</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Courses List */}
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>Select a course to manage items</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No courses yet. Create your first course!
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCourse?.id === course.id
                        ? 'border-primary bg-accent'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{course.course_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(course.course_date).toLocaleDateString()}
                        </p>
                        {course.instructor && (
                          <p className="text-sm text-muted-foreground">
                            Instructor: {course.instructor}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(course.status)}>
                          {course.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>
                  {selectedCourse ? selectedCourse.course_name : 'Select a course'}
                </CardDescription>
              </div>
              {selectedCourse && (
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Item to Course</DialogTitle>
                      <DialogDescription>Reserve materials for this course</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item_name">Item Name *</Label>
                        <Input
                          id="item_name"
                          value={itemForm.item_name}
                          onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                          placeholder="e.g., Arduino Uno"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="quantity">Quantity Reserved *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={itemForm.quantity_reserved}
                          onChange={(e) => setItemForm({ ...itemForm, quantity_reserved: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={itemForm.notes}
                          onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddItem}>Add Item</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCourse ? (
              <div className="text-center py-8 text-muted-foreground">
                Select a course to view and manage materials
              </div>
            ) : courseItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Add materials for this course!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseItems.map((item) => {
                    const remaining = item.quantity_reserved - item.quantity_returned - item.quantity_outstocked;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.quantity_reserved}</TableCell>
                        <TableCell>{item.quantity_returned}</TableCell>
                        <TableCell>{item.quantity_outstocked}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {remaining > 0 && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReturnItem(item)}
                                  title="Return to stock"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOutstockItem(item)}
                                  title="Remove from stock"
                                >
                                  <MinusCircle className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
